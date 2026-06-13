param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFolder, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.CreationCollisionOption, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Transcoding.MediaTranscoder, Windows.Media.Transcoding, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Transcoding.PrepareTranscodeResult, Windows.Media.Transcoding, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.MediaProperties.AudioEncodingQuality, Windows.Media.MediaProperties, ContentType = WindowsRuntime] | Out-Null
[Windows.Foundation.AsyncStatus, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

$asTaskMethods = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' }

function Await-Result($AsyncOperation, [type]$ResultType) {
    $method = $script:asTaskMethods |
        Where-Object { $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
        Select-Object -First 1
    $task = $method.MakeGenericMethod($ResultType).Invoke($null, @($AsyncOperation))
    $task.Wait()
    return $task.Result
}

function Await-Action($AsyncAction) {
    while ($AsyncAction.Status -eq [Windows.Foundation.AsyncStatus]::Started) {
        Start-Sleep -Milliseconds 100
    }
    if ($AsyncAction.Status -eq [Windows.Foundation.AsyncStatus]::Error) {
        throw $AsyncAction.ErrorCode
    }
    if ($AsyncAction.Status -eq [Windows.Foundation.AsyncStatus]::Canceled) {
        throw "Transcode was canceled."
    }
    if ($AsyncAction.PSObject.Methods.Name -contains "GetResults") {
        $AsyncAction.GetResults()
    }
}

$inputFull = [System.IO.Path]::GetFullPath($InputPath)
$outputFull = [System.IO.Path]::GetFullPath($OutputPath)
$outputDir = [System.IO.Path]::GetDirectoryName($outputFull)
$outputName = [System.IO.Path]::GetFileName($outputFull)

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$inputFile = Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync($inputFull)) ([Windows.Storage.StorageFile])
$outputFolder = Await-Result ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync($outputDir)) ([Windows.Storage.StorageFolder])
$outputFile = Await-Result ($outputFolder.CreateFileAsync($outputName, [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])

if ([System.IO.Path]::GetExtension($outputFull).ToLowerInvariant() -eq ".mp3") {
    $profile = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp3([Windows.Media.MediaProperties.AudioEncodingQuality]::High)
} else {
    $profile = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateWav([Windows.Media.MediaProperties.AudioEncodingQuality]::High)
}
$transcoder = [Windows.Media.Transcoding.MediaTranscoder]::new()
$prepared = Await-Result ($transcoder.PrepareFileTranscodeAsync($inputFile, $outputFile, $profile)) ([Windows.Media.Transcoding.PrepareTranscodeResult])

if (-not $prepared.CanTranscode) {
    throw "Cannot transcode '$inputFull' to WAV. Failure reason: $($prepared.FailureReason)"
}

Await-Action ($prepared.TranscodeAsync())
Write-Output $outputFull

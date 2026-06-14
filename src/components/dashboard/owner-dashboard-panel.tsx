"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Eye, Pencil, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

type Robot = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isAvailable: boolean;
  pricePerHour: number;
  currency: string;
  photos: string[];
  availabilityZone: string;
};

type Booking = {
  id: string;
  robotName: string;
  clientName?: string;
  taskDescription: string;
  requestedStart: string;
  requestedEnd: string;
  deliveryAddress: string;
  status: string;
  subtotal: number;
  clientServiceFee?: number;
  depositAmount?: number;
  ownerPayout?: number;
  currency: string;
};

export function OwnerDashboardPanel() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const [robotsResponse, bookingsResponse] = await Promise.all([
      fetch("/api/v1/robots?mine=true"),
      fetch("/api/v1/bookings?role=owner"),
    ]);
    const [robotsResult, bookingsResult] = await Promise.all([
      robotsResponse.json(),
      bookingsResponse.json(),
    ]);
    setRobots(robotsResult.robots ?? []);
    setBookings(bookingsResult.bookings ?? []);
  }

  useEffect(() => {
    let canceled = false;

    Promise.all([
      fetch("/api/v1/robots?mine=true"),
      fetch("/api/v1/bookings?role=owner"),
    ])
      .then(async ([robotsResponse, bookingsResponse]) => {
        const [robotsResult, bookingsResult] = await Promise.all([
          robotsResponse.json(),
          bookingsResponse.json(),
        ]);

        if (!canceled) {
          setRobots(robotsResult.robots ?? []);
          setBookings(bookingsResult.bookings ?? []);
        }
      })
      .catch(() => {
        if (!canceled) {
          setMessage("Dashboard data could not be loaded");
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING"),
    [bookings],
  );
  const activeRobots = robots.filter((robot) => robot.status === "ACTIVE").length;

  async function decideBooking(id: string, action: "approve" | "reject") {
    setMessage(action === "approve" ? "Approving request..." : "Rejecting request...");
    const response = await fetch(`/api/v1/bookings/${id}/${action}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: action === "reject" ? JSON.stringify({ reason: "Owner declined the request" }) : undefined,
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(result.error ?? "Request could not be updated");
      return;
    }

    setMessage(action === "approve" ? "Request approved" : "Request rejected");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Robots" value={String(robots.length)} />
        <Metric label="Active listings" value={String(activeRobots)} />
        <Metric label="Pending requests" value={String(pendingBookings.length)} />
      </div>

      {message ? (
        <p className="rounded-md border border-stone-300 bg-[#FFFDF8] px-4 py-3 text-sm text-stone-700">
          {message}
        </p>
      ) : null}

      <section className="rounded-lg border border-stone-300 bg-[#FFFDF8]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 p-5">
          <div>
            <p className="font-mono text-xs uppercase text-stone-500">Fleet</p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">Robot profiles</h2>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-[#F7F0E8]"
            href="/dashboard/owner/robots/new"
          >
            <Plus size={16} />
            New robot
          </Link>
        </div>
        <div className="divide-y divide-stone-200">
          {robots.length ? (
            robots.map((robot) => (
              <article className="grid gap-4 p-5 md:grid-cols-[96px_1fr_auto]" key={robot.id}>
                <div
                  className="h-24 rounded-md border border-stone-300 bg-cover bg-center"
                  style={{ backgroundImage: `url(${robot.photos[0]})` }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-stone-950">{robot.name}</h3>
                    <span className="rounded-full border border-stone-300 px-2 py-1 text-xs text-stone-600">
                      {robot.status}
                    </span>
                    <span className="rounded-full border border-stone-300 px-2 py-1 text-xs text-stone-600">
                      {robot.isAvailable ? "Available" : "Paused"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {robot.availabilityZone} · {formatCurrency(robot.pricePerHour, robot.currency)} / hour
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800" href={`/robots/${robot.slug}`}>
                    View
                  </Link>
                  <Link
                    className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
                    href={`/dashboard/owner/robots/${robot.id}/edit`}
                  >
                    <Pencil size={15} />
                    Edit
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-stone-600">No robot drafts yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-stone-300 bg-[#FFFDF8]">
        <div className="border-b border-stone-300 p-5">
          <p className="font-mono text-xs uppercase text-stone-500">Requests</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-950">Booking queue</h2>
        </div>
        <div className="divide-y divide-stone-200">
          {bookings.length ? (
            bookings.map((booking) => (
              <article className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]" key={booking.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-stone-950">{booking.robotName}</h3>
                    <span className="rounded-full border border-stone-300 px-2 py-1 text-xs text-stone-600">
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {booking.taskDescription}
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
                    {formatRange(booking.requestedStart, booking.requestedEnd)} · {booking.deliveryAddress}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {formatCurrency(booking.subtotal, booking.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
                    onClick={() => setSelectedBooking(booking)}
                    type="button"
                  >
                    <Eye size={15} />
                    Details
                  </button>
                  {booking.status === "PENDING" ? (
                    <>
                    <button
                      className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-[#F7F0E8]"
                      onClick={() => decideBooking(booking.id, "approve")}
                    >
                      <Check size={15} />
                      Approve
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800"
                      onClick={() => decideBooking(booking.id, "reject")}
                    >
                      <X size={15} />
                      Reject
                    </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-stone-600">No booking requests yet.</p>
          )}
        </div>
      </section>

      <Modal
        description="Review task, delivery, and payout context before deciding."
        onClose={() => setSelectedBooking(null)}
        open={Boolean(selectedBooking)}
        title="Booking request"
      >
        {selectedBooking ? (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs uppercase text-stone-500">Robot</p>
              <h3 className="mt-1 text-2xl font-semibold text-stone-950">
                {selectedBooking.robotName}
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                {formatRange(selectedBooking.requestedStart, selectedBooking.requestedEnd)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Subtotal"
                value={formatCurrency(selectedBooking.subtotal, selectedBooking.currency)}
              />
              <Metric
                label="Deposit"
                value={formatCurrency(selectedBooking.depositAmount ?? 0, selectedBooking.currency)}
              />
              <Metric
                label="Owner payout"
                value={formatCurrency(
                  selectedBooking.ownerPayout ?? selectedBooking.subtotal,
                  selectedBooking.currency,
                )}
              />
            </div>
            <div className="rounded-lg border border-stone-300 bg-[#F7F0E8] p-4">
              <p className="text-sm font-semibold text-stone-950">Task</p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {selectedBooking.taskDescription}
              </p>
            </div>
            <div className="rounded-lg border border-stone-300 bg-[#F7F0E8] p-4">
              <p className="text-sm font-semibold text-stone-950">Delivery</p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {selectedBooking.deliveryAddress}
              </p>
            </div>
            {selectedBooking.status === "PENDING" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-[#F7F0E8]"
                  onClick={() => {
                    void decideBooking(selectedBooking.id, "approve");
                    setSelectedBooking(null);
                  }}
                  type="button"
                >
                  <Check size={15} />
                  Approve
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-800"
                  onClick={() => {
                    void decideBooking(selectedBooking.id, "reject");
                    setSelectedBooking(null);
                  }}
                  type="button"
                >
                  <X size={15} />
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-300 bg-[#FFFDF8] p-5">
      <p className="text-sm text-stone-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function formatRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

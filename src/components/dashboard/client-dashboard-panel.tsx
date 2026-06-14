"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Eye } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";

type Booking = {
  id: string;
  robotName: string;
  taskDescription: string;
  requestedStart: string;
  requestedEnd: string;
  deliveryAddress: string;
  status: string;
  subtotal: number;
  clientServiceFee?: number;
  depositAmount?: number;
  currency: string;
};

export function ClientDashboardPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let canceled = false;

    fetch("/api/v1/bookings?role=client")
      .then((response) => response.json())
      .then((result) => {
        if (!canceled) {
          setBookings(result.bookings ?? []);
        }
      })
      .catch(() => {
        if (!canceled) {
          setMessage("Booking history could not be loaded");
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  const pendingCount = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING").length,
    [bookings],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <Metric label="Open requests" value={String(pendingCount)} />
        <Metric label="Total requests" value={String(bookings.length)} />
        <Metric label="Payment mode" value="Manual" />
      </div>

      {message ? (
        <p className="rounded-md border border-stone-300 bg-[#FFFDF8] px-4 py-3 text-sm text-stone-700">
          {message}
        </p>
      ) : null}

      <section className="rounded-lg border border-stone-300 bg-[#FFFDF8]">
        <div className="border-b border-stone-300 p-5">
          <p className="font-mono text-xs uppercase text-stone-500">Requests</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-950">Booking history</h2>
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
                  <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                    <CalendarClock size={15} />
                    {formatRange(booking.requestedStart, booking.requestedEnd)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {formatCurrency(booking.subtotal, booking.currency)}
                  </p>
                </div>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-800"
                  onClick={() => setSelectedBooking(booking)}
                  type="button"
                >
                  <Eye size={15} />
                  Details
                </button>
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-stone-600">
              No booking requests yet. Find a robot and send your first request.
            </p>
          )}
        </div>
      </section>

      <Modal
        description="Track the request window, task, and payment authorization."
        onClose={() => setSelectedBooking(null)}
        open={Boolean(selectedBooking)}
        title="Booking details"
      >
        {selectedBooking ? (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs uppercase text-stone-500">Robot</p>
              <h3 className="mt-1 text-2xl font-semibold text-stone-950">
                {selectedBooking.robotName}
              </h3>
              <p className="mt-2 text-sm text-stone-600">{selectedBooking.status}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Subtotal"
                value={formatCurrency(selectedBooking.subtotal, selectedBooking.currency)}
              />
              <Metric
                label="Service fee"
                value={formatCurrency(selectedBooking.clientServiceFee ?? 0, selectedBooking.currency)}
              />
              <Metric
                label="Deposit"
                value={formatCurrency(selectedBooking.depositAmount ?? 0, selectedBooking.currency)}
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
      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
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

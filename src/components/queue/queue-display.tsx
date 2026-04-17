"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface QueueItem {
  id: string;
  queuePosition: number;
  customerName: string;
  bookingTime: string;
  serviceName: string;
  barberName: string | null;
  status: string;
  notes: string | null;
}

interface QueueStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

interface QueueDisplayProps {
  shopId: string;
  shopName: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "MENUNGGU",
  CONFIRMED: "DIPROSES",
  COMPLETED: "SELESAI",
  CANCELLED: "DIBATALKAN",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/50",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/50",
};

export function QueueDisplay({ shopId, shopName }: QueueDisplayProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch(`/api/bookings/queue?shopId=${shopId}`);
      const data = await response.json();
      if (data.success) {
        setQueue(data.queue);
        setStats(data.stats);
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    } catch {
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchQueue();

    // Poll every 5 seconds
    const interval = setInterval(fetchQueue, 5000);

    return () => clearInterval(interval);
  }, [fetchQueue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-4xl text-white animate-pulse">Memuat antrian...</div>
      </div>
    );
  }

  // Filter to show only active bookings (PENDING and CONFIRMED)
  const activeQueue = queue.filter((item) => item.status === "PENDING" || item.status === "CONFIRMED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isLive ? "bg-green-500/20" : "bg-red-500/20"}`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${isLive ? "bg-green-500" : "bg-red-500"}`} />
            <span className={`text-2xl font-bold ${isLive ? "text-green-400" : "text-red-400"}`}>
              {isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white">{shopName}</h1>

        <div className="text-2xl text-slate-400">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
        </div>
      </header>

      {/* Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {activeQueue.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="text-6xl text-slate-500 mb-4">Tidak ada antrian</div>
            <div className="text-3xl text-slate-600">Belum ada pelanggan hari ini</div>
          </div>
        ) : (
          activeQueue.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors"
            >
              {/* Queue Number */}
              <div className="text-6xl font-bold text-white mb-4 text-center">
                #{item.queuePosition}
              </div>

              {/* Customer Name */}
              <div className="text-4xl font-bold text-white mb-3 text-center uppercase">
                {item.customerName}
              </div>

              {/* Time */}
              <div className="text-2xl text-slate-400 mb-4 text-center">
                {item.bookingTime}
              </div>

              {/* Service */}
              <div className="text-xl text-slate-300 mb-2 text-center">
                {item.serviceName}
              </div>

              {/* Barber */}
              {item.barberName && (
                <div className="text-xl text-slate-400 mb-4 text-center">
                  Barber: <span className="text-white font-semibold">{item.barberName}</span>
                </div>
              )}

              {/* Status Badge */}
              <div
                className={`text-xl font-bold py-2 px-4 rounded-lg text-center border ${statusColors[item.status]}`}
              >
                {statusLabels[item.status]}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Bar */}
      <footer className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-4xl font-bold text-white">{stats.total}</div>
            <div className="text-xl text-slate-400">Total</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xl text-slate-400">Menunggu</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-400">{stats.confirmed}</div>
            <div className="text-xl text-slate-400">Diproses</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-xl text-slate-400">Selesai</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
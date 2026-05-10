"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // FETCH REQUESTS
  // -----------------------------
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const snap = await getDocs(collection(db, "audiobooks"));

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // -----------------------------
  // APPROVE → START PROCESSING
  // -----------------------------
  const handleApprove = async (id: string) => {
    try {
      const ref = doc(db, "audiobooks", id);

      await updateDoc(ref, {
        status: "processing",
      });

      // update UI instantly
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "processing" } : r
        )
      );

      alert("Sent to processing → audio generation started");
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Failed to approve request");
    }
  };

  // -----------------------------
  // STATUS COLORS
  // -----------------------------
  const statusColor = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "text-yellow-600";
      case "processing":
        return "text-blue-600";
      case "ready":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (loading) {
    return <div className="p-6">Loading requests...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Requests</h1>

      {requests.length === 0 ? (
        <p className="text-gray-500">No requests found</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              {/* FILE NAME */}
              <h2 className="font-semibold text-lg">
                {req.fileName || "Untitled File"}
              </h2>

              {/* USER */}
              <p className="text-sm text-gray-600 mt-1">
                👤 User: {req.userId || "Unknown"}
              </p>

              {/* STATUS */}
              <p
                className={`text-sm mt-1 font-medium ${statusColor(
                  req.status
                )}`}
              >
                Status: {req.status}
              </p>

              {/* CREATED TIME */}
              {req.createdAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Created:{" "}
                  {req.createdAt.toDate
                    ? req.createdAt.toDate().toLocaleString()
                    : "N/A"}
                </p>
              )}

              {/* ACTIONS */}
              <div className="mt-3 flex gap-2 flex-wrap">
                {/* APPROVE BUTTON */}
                {req.status === "pending_approval" && (
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Approve ▶ Generate Audio
                  </button>
                )}
              </div>

              {/* DEBUG (temporary but useful) */}
              <details className="mt-3 text-xs text-gray-400">
                <summary>Debug</summary>
                <pre>{JSON.stringify(req, null, 2)}</pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { formatCents } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  walletBalance: number | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        name: data.get("name"),
        role: data.get("role"),
        password: data.get("password"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setShowCreate(false);
      load();
    } else {
      const json = await res.json();
      setError(json.error);
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    load();
  }

  async function handleRoleChange(id: string, role: string) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          Add User
        </button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <h2 className="font-medium mb-4">Create User</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input name="name" required className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input name="email" type="email" required className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Password</label>
              <input name="password" type="password" required className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Role</label>
              <select name="role" className="border rounded px-3 py-2 text-sm">
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="text-red-600 text-xs w-full">{error}</p>}
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
              {loading ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-gray-500">Cancel</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-gray-500 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Balance</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">{formatCents(u.walletBalance ?? 0)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(u.id, u.isActive)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

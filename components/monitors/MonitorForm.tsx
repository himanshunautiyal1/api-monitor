"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MonitorFormProps {
  initialData?: {
    id?: number;
    name: string;
    url: string;
    intervalMinutes: number;
    method: string;
    headers: Record<string, string>;
    responseTimeThreshold: number;
    tags: string[];
  };
}

const defaultData = {
  name: "",
  url: "",
  intervalMinutes: 5,
  method: "GET",
  headers: {} as Record<string, string>,
  responseTimeThreshold: 2000,
  tags: [] as string[],
};

export default function MonitorForm({ initialData }: MonitorFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [form, setForm] = useState(initialData ?? defaultData);
  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addHeader() {
    if (!headerKey.trim()) return;
    updateField("headers", { ...form.headers, [headerKey]: headerValue });
    setHeaderKey("");
    setHeaderValue("");
  }

  function removeHeader(key: string) {
    const updated = { ...form.headers };
    delete updated[key];
    updateField("headers", updated);
  }

  function addTag() {
    if (!tagInput.trim() || form.tags.includes(tagInput.trim())) return;
    updateField("tags", [...form.tags, tagInput.trim()]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateField(
      "tags",
      form.tags.filter((t) => t !== tag),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEditing ? `/api/monitors/${initialData.id}` : "/api/monitors";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/monitors");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Monitor Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My API"
          required
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          URL
        </label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => updateField("url", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://api.example.com/health"
          required
        />
      </div>

      {/* Method + Interval */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            HTTP Method
          </label>
          <select
            value={form.method}
            onChange={(e) => updateField("method", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="HEAD">HEAD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Check Interval
          </label>
          <select
            value={form.intervalMinutes}
            onChange={(e) =>
              updateField("intervalMinutes", Number(e.target.value))
            }
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Every 1 minute</option>
            <option value={5}>Every 5 minutes</option>
            <option value={15}>Every 15 minutes</option>
          </select>
        </div>
      </div>

      {/* Response Time Threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Response Time Threshold (ms)
        </label>
        <input
          type="number"
          value={form.responseTimeThreshold}
          onChange={(e) =>
            updateField("responseTimeThreshold", Number(e.target.value))
          }
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="2000"
          min={100}
        />
        <p className="text-gray-500 text-xs mt-1">
          Alert if response time exceeds this value
        </p>
      </div>

      {/* Custom Headers */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Headers (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={headerKey}
            onChange={(e) => setHeaderKey(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Key"
          />
          <input
            type="text"
            value={headerValue}
            onChange={(e) => setHeaderValue(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Value"
          />
          <button
            type="button"
            onClick={addHeader}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Add
          </button>
        </div>
        {Object.entries(form.headers).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2 mb-1"
          >
            <span className="text-gray-300 text-sm">
              <span className="text-blue-400">{key}</span>: {value}
            </span>
            <button
              type="button"
              onClick={() => removeHeader(key)}
              className="text-gray-500 hover:text-red-400 text-sm transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTag())
            }
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="production, staging..."
          />
          <button
            type="button"
            onClick={addTag}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          {loading
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Monitor"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

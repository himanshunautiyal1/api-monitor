import MonitorForm from "@/components/monitors/MonitorForm";

export default function NewMonitorPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Add Monitor</h1>
      <p className="text-gray-400 mb-8">Add a new API endpoint to monitor</p>
      <MonitorForm />
    </div>
  );
}

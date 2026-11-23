import { IconDollar, IconDoc, IconUser, IconTrend } from "./icons";

const STATS = [
  {
    label: "Total Sales",
    value: "$4,892.45",
    delta: "▲ 12.5% from yesterday",
    up: true,
    Icon: IconDollar,
  },
  {
    label: "Orders",
    value: "128",
    delta: "▲ 8.2% from yesterday",
    up: true,
    Icon: IconDoc,
  },
  {
    label: "Customers",
    value: "256",
    delta: "▼ 3.4% from yesterday",
    up: false,
    Icon: IconUser,
  },
  {
    label: "Avg. Order Value",
    value: "$38.22",
    delta: "▲ 3.1% from yesterday",
    up: true,
    Icon: IconTrend,
  },
];

export default function StatCards() {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {STATS.map(({ label, value, delta, up, Icon }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "var(--shadow)" }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{label}</span>
            <span
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: "var(--teal-light)", color: "var(--teal)" }}
            >
              <Icon size={16} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 11, color: up ? "var(--green)" : "var(--red)" }}>{delta}</div>
        </div>
      ))}
    </div>
  );
}

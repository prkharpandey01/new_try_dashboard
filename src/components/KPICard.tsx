interface Props {
  title: string;
  value: string | number;
}

export default function KPICard({ title, value }: Props) {
  return (
    <div className="kpi-card">
      <span>{title}</span>
      <h2>{value}</h2>
    </div>
  );
}

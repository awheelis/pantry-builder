interface Props { value: number; }

export default function ProgressBar({ value }: Props) {
  return (
    <div className="progress-bar-outer" style={{ flex: 1 }}>
      <div className="progress-bar-inner" style={{ width: `${value}%` }} />
    </div>
  );
}

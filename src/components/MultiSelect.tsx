import { useState } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options);
    }
  };

  return (
    <div className="multi-select">
      <div
        className="multi-select-input"
        onClick={() => setOpen(!open)}
      >
        <span>
          {selected.length === 0
            ? `All ${label}`
            : `${selected.length} ${label} selected`}
        </span>
        <span>▾</span>
      </div>

      {open && (
        <div className="multi-select-dropdown">
          <label className="multi-select-option">
            <input
              type="checkbox"
              checked={selected.length === options.length}
              onChange={selectAll}
            />
            Select All
          </label>

          {options.map((opt) => (
            <label key={opt} className="multi-select-option">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleValue(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

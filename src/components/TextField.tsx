type TextFieldProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export function TextField({ label, onChange, value }: TextFieldProps) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="field"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

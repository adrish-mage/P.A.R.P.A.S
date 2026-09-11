export default function FormFields({ fields, values, onChange }) {
  return (
    <>
      {fields.map((f) => (
        <div key={f.name}>
          {f.type === "select" ? (
            <select
              value={values[f.name] ?? ""}
              onChange={(e) => onChange(f.name, e.target.value)}
              required={f.required}
            >
              <option value="" disabled>
                {f.label}
              </option>
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.type || "text"}
              placeholder={f.label}
              value={values[f.name] ?? ""}
              onChange={(e) => onChange(f.name, e.target.value)}
              required={f.required}
            />
          )}
        </div>
      ))}
    </>
  );
}

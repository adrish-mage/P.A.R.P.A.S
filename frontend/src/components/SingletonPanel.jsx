import { useEffect, useState } from "react";
import FormFields from "./FormFields.jsx";

export default function SingletonPanel({
  title,
  description,
  fields,
  userId,
  onGet,
  onCreate,
  onUpdate,
  buildCreatePayload,
  buildUpdatePayload,
  renderView,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await onGet(userId);
      setData(result);
      setValues(result);
    } catch (err) {
      if (err.status === 404) {
        setData(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = buildCreatePayload ? await buildCreatePayload(values, userId) : { ...values, userId };
      const created = await onCreate(payload);
      setData(created);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = buildUpdatePayload ? await buildUpdatePayload(values, userId, data) : values;
      const updated = await onUpdate(userId, payload);
      setData(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>{title}</h2>
      {description && <p className="subtitle" style={{ marginBottom: 12 }}>{description}</p>}
      {error && <p style={{ color: "#e05c5c", marginBottom: 12 }}>{error}</p>}
      {loading && <p className="subtitle" style={{ marginBottom: 0 }}>Loading…</p>}

      {!loading && !data && !editing && (
        <button onClick={() => setEditing(true)}>Create {title.toLowerCase()}</button>
      )}

      {!loading && !data && editing && (
        <form onSubmit={handleCreate}>
          <FormFields fields={fields} values={values} onChange={handleChange} />
          <button type="submit">Save</button>
        </form>
      )}

      {!loading && data && !editing && (
        <>
          {renderView ? renderView(data) : <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>}
          <button className="btn-secondary" onClick={() => setEditing(true)} style={{ marginTop: 12 }}>
            Edit
          </button>
        </>
      )}

      {!loading && data && editing && (
        <form onSubmit={handleUpdate}>
          <FormFields fields={fields} values={values} onChange={handleChange} />
          <button type="submit">Save changes</button>
        </form>
      )}
    </div>
  );
}

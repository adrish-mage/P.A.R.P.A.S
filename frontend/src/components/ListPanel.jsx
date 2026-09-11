import { useEffect, useState } from "react";
import FormFields from "./FormFields.jsx";

export default function ListPanel({
  title,
  description,
  fields,
  userId,
  onList,
  onCreate,
  onDelete,
  buildCreatePayload,
  renderItem,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      const result = await onList(userId);
      setItems(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = buildCreatePayload ? await buildCreatePayload(values, userId) : { ...values, userId };
      await onCreate(payload);
      setValues({});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await onDelete(id);
      load();
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

      {!loading && items.length === 0 && (
        <p className="subtitle" style={{ marginBottom: 12 }}>Nothing added yet.</p>
      )}

      {!loading &&
        items.map((item) => (
          <div className="list-item" key={item._id}>
            {renderItem ? renderItem(item) : <span>{item.title || item.name}</span>}
            <button className="btn-secondary" onClick={() => handleDelete(item._id)} style={{ padding: "6px 10px" }}>
              Delete
            </button>
          </div>
        ))}

      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{ marginTop: 12 }}>
          Add {title.toLowerCase().replace(/s$/, "")}
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <FormFields fields={fields} values={values} onChange={handleChange} />
          <button type="submit">Save</button>
        </form>
      )}
    </div>
  );
}

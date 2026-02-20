export default function Checklist({ titulo, items }) {
    return (
      <div className="rounded bg-white p-4 shadow">
        <h3 className="mb-3 font-semibold">{titulo}</h3>
  
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span>
                {item.ok ? "✅" : "❌"}
              </span>
              <span className={item.ok ? "text-gray-700" : "text-red-600"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  
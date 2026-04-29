interface Item {
  _id: string;
  title: string;
  downloadCount: number;
}

export default function TopPdfTable({ data }: { data: Item[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-primary)" }}>
        📄 Top 5 סיכומי רבנות שהורדו
      </h2>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">אין נתונים עדיין</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-right pb-2 font-semibold text-gray-600">#</th>
              <th className="text-right pb-2 font-semibold text-gray-600">שם הסיכום</th>
              <th className="text-left pb-2 font-semibold text-gray-600">הורדות</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 pr-1 text-gray-400 font-medium">{i + 1}</td>
                <td className="py-2">{item.title}</td>
                <td
                  className="py-2 pl-1 font-bold text-left"
                  style={{ color: "var(--color-primary)" }}
                >
                  {item.downloadCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

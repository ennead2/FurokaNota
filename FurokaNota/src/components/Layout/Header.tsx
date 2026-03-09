interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
    </header>
  );
}

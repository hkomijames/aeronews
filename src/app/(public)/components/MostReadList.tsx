import Link from 'next/link';

interface MostReadItem {
  title: string;
  href: string;
}

interface MostReadListProps {
  title: string;
  items: MostReadItem[];
  titleClassName?: string;
  containerClassName?: string;
}

export default function MostReadList({
  title,
  items,
  titleClassName = 'font-black text-sm text-slate-900 uppercase tracking-wider',
  containerClassName = 'bg-slate-50/60 border border-slate-100 p-5 rounded-xl',
}: MostReadListProps) {
  return (
    <div className={containerClassName}>
      <h3 className={`border-b border-slate-200/60 pb-3 mb-4 ${titleClassName}`}>
        {title}
      </h3>
      <ol className="flex flex-col gap-4">
        {items.map((item, index) => (
          <li key={item.href} className="flex gap-3 items-start">
            <span className="font-black text-orange-700 text-lg leading-none mt-0.5">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-800 leading-snug">
                <Link
                  href={item.href}
                  prefetch={false}
                  className="block hover:text-blue-600 transition-colors duration-150"
                >
                  {item.title}
                </Link>
              </h4>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

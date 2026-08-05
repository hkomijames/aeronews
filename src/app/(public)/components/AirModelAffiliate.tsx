import Link from 'next/link';

export interface AirModelAffiliateProduct {
  title: string;
  description: string;
  imageUrl: string;
  rating: number;
  url: string;
  inStock?: boolean;
}

interface AirModelAffiliateProps {
  products?: AirModelAffiliateProduct[];
  variant?: 'main' | 'sidebar';
  title?: string;
  subtitle?: string;
}

const defaultProducts: AirModelAffiliateProduct[] = [
  {
    title: 'Bell UH-1H Huey',
    description: 'The Bell UH-1H Huey, a variant of the Iroquois family, is famed for its reliability and adaptability in military operations.',
    imageUrl: 'https://airmodels.net/cdn/shop/files/10269.jpg',
    rating: 10,
    url: 'https://airmodels.net/products/bell-uh-1h-huey?aff=uyiwbeln',
    inStock: true,
  },
  {
    title: 'Helicopter Landing Pad',
    description: 'Give your model helicopters the landing-ready display they deserve. This premium Square Helipad Display Mat is the',
    imageUrl: 'https://airmodels.net/cdn/shop/files/HelicopterLandingPadDisplayMat3.png',
    rating: 5,
    url: 'https://airmodels.net/products/helicopter-landing-pad-display-mat?aff=uyiwbeln',
    inStock: true,
  },
  {
    title: 'SR-71A Blackbird - 61-7960',
    description: 'This premium 1/72 scale diecast model accurately replicates the historic Lockheed Martin SR-71A Blackbird.',
    imageUrl: 'https://airmodels.net/cdn/shop/files/PremiumSR-71BlackbirdDiecastModel2.png',
    rating: 12,
    url: 'https://airmodels.net/products/sr-71-blackbird-premium?aff=uyiwbeln',
    inStock: true,
  },
  {
    title: 'F-35B Lightning II - USMC',
    description: 'A single-seat, single-engine, all-weather stealth multi role fighter designed for ground attack and air-superiority missions.',
    imageUrl: 'https://airmodels.net/cdn/shop/files/4221.jpg',
    rating: 13,
    url: 'https://airmodels.net/products/f-35b-lightning-ii-usmc?aff=uyiwbeln',
    inStock: true,
  },
  {
    title: 'Prototype Boeing 747',
    description: 'Made from durable diecast metal, this model is built to last and is perfect for both collectors and aviation enthusiasts.',
    imageUrl: 'https://airmodels.net/cdn/shop/files/boeing-747-prototype-house-colours-diecast-model-8.png',
    rating: 11,
    url: 'https://airmodels.net/products/prototype-boeing-747?aff=uyiwbeln',
    inStock: true,
  },
  {
    title: 'Lockheed F-22 Raptor',
    description: 'A single-seat, twin-engine, all-weather stealth tactical fighter developed for the United States Air Force - entering service in December 2005.',
    imageUrl: 'https://airmodels.net/cdn/shop/files/875.jpg',
    rating: 16,
    url: 'https://airmodels.net/collections/air-to-air-combat/products/lockheed-f-22-raptor?aff=uyiwbeln',
    inStock: true,
  },
];

const lineClampStyle = (lines: number) => ({
  display: '-webkit-box' as const,
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden' as const,
});

export default function AirModelAffiliate({
  products = defaultProducts,
  variant = 'main',
  title = 'AirModel Picks',
  subtitle = 'Curated tools and gear for aviation enthusiasts.',
}: AirModelAffiliateProps) {
  const visibleProducts = variant === 'sidebar' ? products.slice(0, 4) : products.slice(0, 6);

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div
        className={
          variant === 'sidebar'
            ? 'grid grid-cols-1 gap-4'
            : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {visibleProducts.map((product, index) => (
          <article
            key={`${product.title}-${index}`}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <img
              src={product.imageUrl}
              alt={product.title}
              loading="lazy"
              decoding="async"
              className="aspect-4/3 w-full object-cover"
            />

            <div className="flex flex-1 flex-col p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-green-600" aria-hidden="true" />
                  <span className="text-sm font-semibold text-green-600">In stock</span>
                </div>

                <div className="flex items-center gap-1 text-sm font-semibold text-orange-700">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <span key={starIndex} aria-hidden="true">
                      ★
                    </span>
                  ))}
                  <span className="ml-1 text-sm text-slate-600">({product.rating.toFixed(1)})</span>
                </div>
              </div>

              <h4 className="mb-2 text-sm font-bold leading-5 text-slate-900" style={lineClampStyle(1)}>
                {product.title}
              </h4>
              <p className="mb-4 text-sm leading-6 text-slate-600" style={lineClampStyle(2)}>
                {product.description}
              </p>

              <Link
                href={product.url}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                prefetch={false}
                className="mt-auto inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-white hover:text-slate-900"
              >
                Check It Out At AirModel
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

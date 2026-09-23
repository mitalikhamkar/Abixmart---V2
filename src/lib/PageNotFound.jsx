import { useLocation, Link } from 'react-router-dom';

// Empty state — brought onto the ABIXMART system. Previously untouched
// shadcn boilerplate using raw slate/white Tailwind colors.
export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ivory">
      <div className="max-w-md w-full text-center">
        <span className="label-meta text-resin">Error</span>
        <h1 className="mt-4 font-display text-7xl text-greendark leading-none">404</h1>
        <div className="mt-5 h-px w-16 bg-greendark/15 mx-auto" />

        <h2 className="mt-7 font-display text-2xl lg:text-3xl text-greendark">
          Page not found
        </h2>
        <p className="mt-3 text-foreground/60 leading-relaxed">
          The page <span className="font-medium text-greendark">"{pageName}"</span> could not be found.
        </p>

        <Link to="/" className="btn-primary mt-9">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
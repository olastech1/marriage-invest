import Link from 'next/link';

const footerLinks = {
  company: [
    { label: 'Get Married Online', href: '/get-married' },
    { label: 'Wedding Cash Registry', href: '/registry' },
    { label: 'About Us', href: '/about' },
    { label: 'Investments', href: '/investments' },
    { label: 'Community & Philanthropy', href: '/community' },
    { label: 'Documents', href: '/documents' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#060E20] text-gray-400">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 flex-shrink-0 block"
                style={{ width: 32, height: 32, maxWidth: 32, maxHeight: 32 }}
              >
                <circle cx="16" cy="16" r="13" stroke="#C9A84C" strokeWidth="2" />
                <path d="M16 8L20 13H12L16 8Z" fill="#C9A84C" />
                <path d="M12 13L16 24L20 13H12Z" fill="#C9A84C" opacity="0.7" />
              </svg>
              <span className="text-white font-bold text-xl tracking-tight group-hover:text-[#C9A84C] transition-colors duration-200">
                Union<span className="text-[#C9A84C]">Verify</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 max-w-sm">
              Building Wealth Together — a joint savings and investment platform
              for couples.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-[#C9A84C] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-[#C9A84C] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="text-gray-500 font-medium">Risk Disclaimer: </span>
            Investments in Union Verify involve risk, including the possible
            loss of principal. Past performance is not indicative of future
            results, and returns are not guaranteed. All investment decisions
            should be made in consultation with a qualified financial adviser.
            Union Verify does not provide personalised investment, tax, or legal
            advice. Please read all offering documents carefully before
            investing. Investment products are not insured by any government
            deposit protection scheme.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Union Verify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

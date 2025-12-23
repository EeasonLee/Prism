import { PageContainer } from './PageContainer';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <PageContainer className="py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Section */}
          <div className="lg:col-span-2">
            <h4 className="mb-4 text-base font-semibold text-gray-900">
              Company
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <a
                  href="mailto:customerservice@joydeem.com"
                  className="underline hover:text-gray-900"
                >
                  customerservice@joydeem.com
                </a>
              </p>
              <p>
                Phone:{' '}
                <a href="tel:888-381-8996" className="hover:text-gray-900">
                  888-381-8996
                </a>{' '}
                (Mon-Fri, 10:00 AM–6:00 PM EST)
              </p>
              <p>
                HK Address: Room A, 9th Floor, Eton Building, 288 Des Voeux Road
                Central, Sheung Wan, Hong Kong
              </p>
              <p>Canada Address: 23 Hubner Ave Markham ON L6C 0S8 CANADA</p>
            </div>
          </div>

          {/* Information Section */}
          <div>
            <h4 className="mb-4 text-base font-semibold text-gray-900">
              Information
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.joydeem.com/customer/account/"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  My account
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/customer/account/login/"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  Login
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/checkout/cart/"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  My cart
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/wishlist/"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  Wishlist
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/checkout/"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  Check out
                </a>
              </li>
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h4 className="mb-4 text-base font-semibold text-gray-900">
              Services
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.joydeem.com/aboutus"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/privacy-policy"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/faqs"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  FAQs
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/return-policy"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  Returns Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/shipping-policy"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  Shipping Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.joydeem.com/terms-of-use"
                  className="text-gray-600 hover:text-gray-900"
                  rel="noopener noreferrer"
                >
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Joydeem. All rights reserved.
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}

import HeroSection from "@/components/HeroSection";
import StickyPracticeBox from "@/components/StickyPracticeBox";
import HowItWorks from "@/components/HowItWorks";
import OfferSection from "@/components/OfferSection";
import ContentSection from "@/components/ContentSection";

/**
 * Home landing page layout containing the hero banner,
 * informational sections, pricing/offer tables, and the 
 * interactive StickyPracticeBox presented responsively for
 * desktop and mobile screens.
 */
export default function Home() {
  return (
    <>
      <div>

        <div>

          <div>

            {/* Hero banner to grab user attention */}
            <HeroSection />

            {/* Mobile Practice Box: Displayed only on smaller viewports (below xl breakpoint) */}
            <div className="d-block d-xl-none">
              <StickyPracticeBox mobile />
            </div>

            {/* How It Works steps grid */}
            <HowItWorks />

            {/* Pricing details and Purchase upgrade checkout section */}
            <OfferSection />

            {/* General informative articles/benefits about speed math */}
            <ContentSection />

            {/* Desktop Floating Box: Positioned sticky on the side for wider screens (xl and up) */}
            <div className="d-none d-xl-block">
              <StickyPracticeBox />
            </div>

          </div>

        </div>

      </div>
    </>
  );
}
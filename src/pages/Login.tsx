import { LoginForm } from "@/components/auth/LoginForm";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/CookieConsent";

import { classCrest as classCrest } from "@/lib/images";
import { schoolEntrance as schoolEntrance } from "@/lib/images";

const schoolLogo = classCrest.url;

export function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col animate-page-in">
      <div 
        className="flex-1 flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: `url('${schoolEntrance.url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md animate-zoom-in">
          <LoginForm schoolLogo={schoolLogo} />
        </div>
      </div>
      <Footer />
      <CookieConsent />
    </div>
  );
}

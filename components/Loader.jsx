import Image from 'next/image';

export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="space-y-6 text-center">
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 flex items-center justify-center animate-spin">
            <Image
              src="/assets/logo/jobtracker-logo.png"
              alt="Job Tracker Logo"
              width={96}
              height={96}
              priority
              className="drop-shadow-lg"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Image
            src="/assets/logo/jobtracker-text.png"
            alt="Job Application Tracker"
            width={300}
            height={40}
            priority
            className="mx-auto"
          />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

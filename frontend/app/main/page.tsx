import Link from "next/link";
import { getSubdomainUrl } from "../utils/urls";

export default function Home() {
  return (
    <div className="flex flex-col items-center p-10">
      <div className="text-6xl text-center mb-10">
        This is the Main Page of the app.
      </div>

      <Link href={getSubdomainUrl('admin', '/')} className={'text-4xl p-5 bg-blue-500 rounded-2xl'}>
        Link to the admin sub-domain
      </Link>
    </div>
  );
}

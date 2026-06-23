import Link from "next/link";
import { getSubdomainUrl } from "../utils/urls";

export default function admin(){
    return(
        <div className="flex flex-col items-center p-10">
            <div className="text-6xl mb-10 text-center">
                This is the admin sub-domain of the app
            </div>
            <Link href={getSubdomainUrl('main', '/')} className="text-4xl bg-amber-500 p-5 rounded-2xl">Heres a link to the main page.</Link>
        </div>
    )
}
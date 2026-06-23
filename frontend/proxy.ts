import { NextResponse } from "next/server";
import { NextRequest } from "next/server";


export function proxy(request: NextRequest){
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';

    // Remove localhost and :3000 from the hostname
    const currentHost = hostname
        .replace(':3000', '')
        .replace('.localhost', '');


    



    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('/static/') ||
        url.pathname.includes('webpack-hmr') ||
        url.pathname.includes('.')
    ){
        return NextResponse.next();
    }

    if (currentHost === 'app'){
        url.pathname = `/app-sub${url.pathname}`;
        return NextResponse.rewrite(url);
    }
    
    
    if (currentHost === 'admin'){
        url.pathname = `/admin-sub${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    if (currentHost === 'localhost'){
        url.pathname = `/main${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    return NextResponse.next;

}
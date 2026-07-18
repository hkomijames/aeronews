import Link from 'next/link';
import AeroSagaLogo from './AeroSagaLogo';

export default function Navbar() {

    return (

         <nav className="w-full lg:w-[80%] flex items-center justify-between p-2 bg-orange-600 text-orange-100">
            <Link href="/" 
            className="logo-link"
            aria-label="Aero Saga Home"

            ><AeroSagaLogo /></Link>
            <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
            </ul>
        </nav>
    )
}
import Nav from "../common/Nav.jsx";
import Logo from "../common/Logo.jsx";

const Header = () => {
        return(
        <header className="sticky top-0 z-40 border-b border-primary/10 bg-secondary/95 shadow-sm backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8 lg:px-10">
                <Logo/>
                <Nav />
            </div>
        </header>
    )}

export default Header;    

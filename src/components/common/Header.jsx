import Nav from "../common/Nav.jsx";
import Logo from "../common/Logo.jsx";

const Header = () => {
        return(
        <div className="flex justify-between p-4 bg-secondary text-white">
            <Logo/>
            <Nav />
        </div>
    )}

export default Header;    
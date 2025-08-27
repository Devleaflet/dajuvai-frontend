import { useState } from "react";
import VendorLogin from "./VendorLogin";

const VendorLoginPage = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <VendorLogin
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
        />
    );
};

export default VendorLoginPage;

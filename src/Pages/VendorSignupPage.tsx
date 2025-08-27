import { useState } from "react";
import VendorSignup from "./VendorSignup";

const VendorSignupPage = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <VendorSignup
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
        />
    );
};

export default VendorSignupPage;

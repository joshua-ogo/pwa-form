import { createBrowserRouter } from "react-router-dom";
import { IntakeForm } from "../components/IntakeForm";

export const router = createBrowserRouter([
    // {
    //     path: "/",
    //     element: <IntakeForm />,
    // children: [
    //         {
    //             index: true,
    //             element: <HomePage />,
    //         },
    //         {
    //             path: "sign-in",
    //             element: <SignInPage />
    //         },
    //         {
    //             path: "forgot-password",
    //             element: <ForgotPassword />
    //         },
    //         {
    //             path: "otp-verification",
    //             element: <OTPForm />
    //         },
    //         {
    //             path: "reset-password",
    //             element: <ResetPasswordForm />
    //         },
    //         {
    //             path: "configure-taxes",
    //             element: <ConfigureTaxes />
    //         },
    //         // Add more routes here
    //         // Example:
    //         // {
    //         //   path: "dashboard",
    //         //   element: <DashboardPage />,
    //         // },
    //     ],
    // },
    {
        path: "/",
        element: <IntakeForm />,
    },
]);

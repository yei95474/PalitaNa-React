import { Link } from 'react-router-dom';

function PageUnderDevelopment() {
    return (
        <main>
            <h1>This page is under development.</h1>
            <Link to="/">Go back to home page</Link>
        </main>
    );
}

export default PageUnderDevelopment;
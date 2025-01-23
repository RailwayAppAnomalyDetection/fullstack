"use client";

export default function GlobalError({
            error,
                                    }: {
    error: Error & { digest?: string };
}){
    return(
        <html>
            <head>
                <title>Global Error</title>
            </head>
            <body>
                <h1>Global Error</h1>
                <p>{error.message}</p>
            </body>
        </html>
    
)
}
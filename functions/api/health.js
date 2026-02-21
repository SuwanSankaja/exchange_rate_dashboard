export async function onRequestGet() {
    return Response.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
    });
}

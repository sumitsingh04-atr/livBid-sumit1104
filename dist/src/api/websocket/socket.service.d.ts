declare class SocketService {
    private io;
    private viewerCounts;
    init(server: any): void;
    private decrementViewerCount;
    emitToAuction(auctionId: string | number, event: string, payload: any): void;
}
declare const _default: SocketService;
export default _default;
//# sourceMappingURL=socket.service.d.ts.map
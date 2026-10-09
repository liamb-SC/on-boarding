// Brightwell orders, as the support team's tools see them. Plain data, no I/O.
export const orders = [
  { id: 'BW-1001', status: 'shipped', carrier: 'SwiftDrop', eta: '2026-11-19', delayed: false },
  { id: 'BW-1002', status: 'out_for_delivery', carrier: 'SwiftDrop', eta: '2026-11-18', delayed: false },
  { id: 'BW-1003', status: 'shipped', carrier: 'Parcelwise', eta: '2026-11-22', delayed: true },
  { id: 'BW-1004', status: 'delivered', carrier: 'SwiftDrop', eta: '2026-11-17', delayed: false },
  { id: 'BW-1005', status: 'shipped', carrier: 'SwiftDrop', eta: '2026-11-21', delayed: true },
  { id: 'BW-1006', status: 'out_for_delivery', carrier: 'Parcelwise', eta: '2026-11-20', delayed: true },
];

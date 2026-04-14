import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Lusaka area GPS coordinates for 20 agents
const lusakaAgentLocations = [
  { name: 'Soweto Market Money', area: 'Soweto', lat: -15.4197, lng: 28.2772 },
  { name: 'Kaunda Square Zamtel', area: 'Kaunda Square', lat: -15.3894, lng: 28.3412 },
  { name: 'Chelston Cash Point', area: 'Chelston', lat: -15.3712, lng: 28.3654 },
  { name: 'Mtendere Money Hub', area: 'Mtendere', lat: -15.4056, lng: 28.3921 },
  { name: 'Chawama Liquidity', area: 'Chawama', lat: -15.4442, lng: 28.2913 },
  { name: 'Emmasdale Agent', area: 'Emmasdale', lat: -15.4234, lng: 28.3127 },
  { name: 'Kabulonga Finance', area: 'Kabulonga', lat: -15.3891, lng: 28.3278 },
  { name: 'Ibex Hill Money', area: 'Ibex Hill', lat: -15.3765, lng: 28.3534 },
  { name: 'Lusaka Central', area: 'CBD', lat: -15.4167, lng: 28.2833 },
  { name: 'Chilenje Money Point', area: 'Chilenje', lat: -15.4312, lng: 28.2567 },
  { name: 'Woodlands Zamtel Agent', area: 'Woodlands', lat: -15.3978, lng: 28.3089 },
  { name: 'Olympia Park Finance', area: 'Olympia', lat: -15.4089, lng: 28.3345 },
  { name: 'Avondale Cash Hub', area: 'Avondale', lat: -15.3823, lng: 28.3156 },
  { name: 'Mandevu Money Services', area: 'Mandevu', lat: -15.4567, lng: 28.3234 },
  { name: 'Kalingalinga Agent', area: 'Kalingalinga', lat: -15.4234, lng: 28.3478 },
  { name: 'Matero Money Point', area: 'Matero', lat: -15.4089, lng: 28.2678 },
  { name: 'Ngombe Cash Services', area: 'Ngombe', lat: -15.4312, lng: 28.2445 },
  { name: 'Libala Float Center', area: 'Libala', lat: -15.4567, lng: 28.2789 },
  { name: 'Roma Money Hub', area: 'Roma', lat: -15.3712, lng: 28.3289 },
  { name: 'Thornpark Zamtel', area: 'Thornpark', lat: -15.3945, lng: 28.3567 },
];

const zambiaMsisdns = [
  '0961100001', '0961100002', '0961100003', '0961100004', '0961100005',
  '0961100006', '0961100007', '0961100008', '0961100009', '0961100010',
  '0961100011', '0961100012', '0961100013', '0961100014', '0961100015',
  '0961100016', '0961100017', '0961100018', '0961100019', '0961100020',
];

async function main() {
  console.log('🌱 Seeding ZLMS database...');

  // Clear existing data
  await prisma.rebalancerObservation.deleteMany();
  await prisma.burnDownTracker.deleteMany();
  await prisma.rebalanceTransaction.deleteMany();
  await prisma.rebalanceRequest.deleteMany();
  await prisma.trnSubmission.deleteMany();
  await prisma.agentMoneyTransaction.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.rebalancer.deleteMany();
  await prisma.masterAgent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  const pin = await bcrypt.hash('123456', 10);

  // Super Admin
  await prisma.user.create({
    data: { phone: '0970000001', pin, role: 'SUPER_ADMIN', name: 'System Administrator', zone: 'National' },
  });

  // TDE Users
  await prisma.user.create({
    data: { phone: '0970000002', pin, role: 'TDE', name: 'Mwape Mutale', zone: 'Lusaka' },
  });
  await prisma.user.create({
    data: { phone: '0970000003', pin, role: 'TDE', name: 'Chanda Bwalya', zone: 'Copperbelt' },
  });

  // Master Agent Users
  const maUser1 = await prisma.user.create({
    data: { phone: '0970000010', pin, role: 'MASTER_AGENT', name: 'Kelvin Phiri', zone: 'Lusaka' },
  });
  const maUser2 = await prisma.user.create({
    data: { phone: '0970000011', pin, role: 'MASTER_AGENT', name: 'Agnes Tembo', zone: 'Copperbelt' },
  });
  const maUser3 = await prisma.user.create({
    data: { phone: '0970000012', pin, role: 'MASTER_AGENT', name: 'Patrick Mwanza', zone: 'Northern' },
  });

  // Master Agents
  const ma1 = await prisma.masterAgent.create({
    data: { userId: maUser1.id, name: 'Kelvin Phiri', zone: 'Lusaka', floatPoolBalance: 500000 },
  });
  const ma2 = await prisma.masterAgent.create({
    data: { userId: maUser2.id, name: 'Agnes Tembo', zone: 'Copperbelt', floatPoolBalance: 300000 },
  });
  const ma3 = await prisma.masterAgent.create({
    data: { userId: maUser3.id, name: 'Patrick Mwanza', zone: 'Northern', floatPoolBalance: 200000 },
  });

  // Rebalancer Users
  const rebUsers = await Promise.all([
    prisma.user.create({ data: { phone: '0970000020', pin, role: 'REBALANCER', name: 'Joseph Banda', zone: 'Lusaka' } }),
    prisma.user.create({ data: { phone: '0970000021', pin, role: 'REBALANCER', name: 'Grace Zulu', zone: 'Lusaka' } }),
    prisma.user.create({ data: { phone: '0970000022', pin, role: 'REBALANCER', name: 'Moses Lungu', zone: 'Lusaka' } }),
    prisma.user.create({ data: { phone: '0970000023', pin, role: 'REBALANCER', name: 'Faith Mumba', zone: 'Copperbelt' } }),
    prisma.user.create({ data: { phone: '0970000024', pin, role: 'REBALANCER', name: 'Daniel Sakala', zone: 'Northern' } }),
  ]);

  // Rebalancers
  const rebalancers = await Promise.all([
    prisma.rebalancer.create({ data: { userId: rebUsers[0].id, name: 'Joseph Banda', zone: 'Lusaka', cashHolding: 50000, masterAgentId: ma1.id } }),
    prisma.rebalancer.create({ data: { userId: rebUsers[1].id, name: 'Grace Zulu', zone: 'Lusaka', cashHolding: 45000, masterAgentId: ma1.id } }),
    prisma.rebalancer.create({ data: { userId: rebUsers[2].id, name: 'Moses Lungu', zone: 'Lusaka', cashHolding: 40000, masterAgentId: ma1.id } }),
    prisma.rebalancer.create({ data: { userId: rebUsers[3].id, name: 'Faith Mumba', zone: 'Copperbelt', cashHolding: 30000, masterAgentId: ma2.id } }),
    prisma.rebalancer.create({ data: { userId: rebUsers[4].id, name: 'Daniel Sakala', zone: 'Northern', cashHolding: 25000, masterAgentId: ma3.id } }),
  ]);

  // LUR scores: green, amber, orange, red mix
  const lurScores = [0.92, 0.88, 0.85, 0.83, 0.79, 0.75, 0.72, 0.68, 0.61, 0.55,
    0.48, 0.44, 0.38, 0.32, 0.27, 0.22, 0.15, 0.82, 0.71, 0.64];
  const casScores = [88, 85, 92, 79, 75, 72, 68, 61, 55, 48,
    44, 38, 32, 27, 22, 15, 10, 83, 70, 65];
  const statuses = [
    'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
    'ACTIVE', 'ACTIVE', 'ACTIVE', 'FLAGGED', 'FLAGGED', 'SUSPENDED', 'SUSPENDED', 'ACTIVE', 'ACTIVE', 'ACTIVE',
  ];

  // Create 20 agents
  const agents = await Promise.all(
    lusakaAgentLocations.map(async (loc, i) => {
      return prisma.agent.create({
        data: {
          businessName: loc.name,
          msisdn: zambiaMsisdns[i],
          gpsLat: loc.lat,
          gpsLng: loc.lng,
          geofenceRadiusM: 100,
          floatBalance: Math.floor(Math.random() * 20000) + 5000,
          cashBalance: Math.floor(Math.random() * 10000) + 2000,
          lurScore: lurScores[i],
          casScore: casScores[i],
          requestLocked: lurScores[i] < 0.25,
          status: statuses[i],
          masterAgentId: i < 14 ? ma1.id : i < 17 ? ma2.id : ma3.id,
          assignedRebalancerId: rebalancers[i % 3].id,
          lastRebalancedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000),
        },
      });
    })
  );

  // Create completed rebalance transactions (for heatmap serviced areas)
  for (let i = 0; i < 15; i++) {
    const agent = agents[i];
    const rebalancer = rebalancers[i % 3];
    const amount = Math.floor(Math.random() * 15000) + 5000;
    const dispensedAt = new Date(Date.now() - (i + 1) * 12 * 3600 * 1000);

    const req = await prisma.rebalanceRequest.create({
      data: {
        agentId: agent.id,
        rebalancerId: rebalancer.id,
        amountRequested: amount,
        amountApproved: amount,
        type: 'BOTH',
        status: 'COMPLETED',
        lurAtRequest: agent.lurScore,
      },
    });

    const txn = await prisma.rebalanceTransaction.create({
      data: {
        requestId: req.id,
        rebalancerId: rebalancer.id,
        agentId: agent.id,
        cashAmount: amount * 0.4,
        floatAmount: amount * 0.6,
        gpsLatAtDispense: agent.gpsLat + (Math.random() - 0.5) * 0.0005,
        gpsLngAtDispense: agent.gpsLng + (Math.random() - 0.5) * 0.0005,
        distanceFromAgent: Math.random() * 80,
        qrScanVerified: true,
        otpVerified: true,
        dispensedAt,
        burnTargetDate: new Date(dispensedAt.getTime() + 72 * 3600 * 1000),
        burnTargetAmount: amount,
      },
    });

    const burnPct = Math.min(lurScores[i] * 100, 95);
    await prisma.burnDownTracker.create({
      data: {
        txnId: txn.id,
        agentId: agent.id,
        initialAmount: amount,
        currentUtilized: amount * (burnPct / 100),
        burnPct,
        alertLevel: burnPct >= 80 ? 'GREEN' : burnPct >= 50 ? 'YELLOW' : burnPct >= 30 ? 'ORANGE' : 'RED',
        status: burnPct >= 90 ? 'COMPLETED' : 'ACTIVE',
      },
    });

    // Some agents get TRN submissions
    if (i < 10) {
      await prisma.trnSubmission.create({
        data: {
          agentId: agent.id,
          trn: `ZMT${Date.now()}${i}`,
          declaredAmount: amount * 0.5,
          declaredType: 'CASH_IN',
          structuralValid: true,
          coreVerified: false,
        },
      });

      await prisma.agentMoneyTransaction.create({
        data: {
          agentId: agent.id,
          amount: amount * 0.5,
          txnType: 'CASH_IN',
          txnTimestamp: new Date(dispensedAt.getTime() + 2 * 3600 * 1000),
          source: 'TRN_SUBMISSION',
          verified: false,
        },
      });
    }
  }

  // Commission for MA1
  await prisma.commission.create({
    data: {
      masterAgentId: ma1.id,
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-31'),
      totalDistributed: 450000,
      lurAvg: 0.68,
      baseFee: 4500,
      utilizationBonus: 1800,
      totalCommission: 6300,
      status: 'DRAFT',
    },
  });

  // System config
  await prisma.systemConfig.createMany({
    data: [
      { key: 'INTEGRATION_MODE', value: process.env.INTEGRATION_MODE || 'standalone' },
      { key: 'OTP_EXPIRY_SECONDS', value: '300' },
      { key: 'GEOFENCE_RADIUS_M', value: '100' },
      { key: 'BURN_TARGET_HOURS', value: '72' },
      { key: 'LUR_GREEN_THRESHOLD', value: '0.80' },
      { key: 'LUR_AMBER_THRESHOLD', value: '0.50' },
      { key: 'LUR_ORANGE_THRESHOLD', value: '0.30' },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('   Credentials: phone 0970000001 / 0970000002 / 0970000010 / 0970000020 — PIN: 123456');
  console.log(`   Agents: ${agents.length} Lusaka agents seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

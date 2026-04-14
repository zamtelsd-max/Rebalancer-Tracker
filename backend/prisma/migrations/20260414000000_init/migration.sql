-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "floatPoolBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rebalancer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "cashHolding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masterAgentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rebalancer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "msisdn" TEXT NOT NULL,
    "gpsLat" DOUBLE PRECISION NOT NULL,
    "gpsLng" DOUBLE PRECISION NOT NULL,
    "geofenceRadiusM" INTEGER NOT NULL DEFAULT 100,
    "qrCodeToken" TEXT NOT NULL,
    "floatBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lurScore" DOUBLE PRECISION,
    "casScore" DOUBLE PRECISION,
    "requestLocked" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastRebalancedAt" TIMESTAMP(3),
    "masterAgentId" TEXT,
    "assignedRebalancerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalanceRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "rebalancerId" TEXT,
    "amountRequested" DOUBLE PRECISION NOT NULL,
    "amountApproved" DOUBLE PRECISION,
    "type" TEXT NOT NULL DEFAULT 'BOTH',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lurAtRequest" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RebalanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalanceTransaction" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "rebalancerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "cashAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "floatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gpsLatAtDispense" DOUBLE PRECISION,
    "gpsLngAtDispense" DOUBLE PRECISION,
    "distanceFromAgent" DOUBLE PRECISION,
    "qrScanVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" TIMESTAMP(3),
    "burnTargetDate" TIMESTAMP(3),
    "burnTargetAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RebalanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurnDownTracker" (
    "id" TEXT NOT NULL,
    "txnId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "initialAmount" DOUBLE PRECISION NOT NULL,
    "currentUtilized" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "burnPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertLevel" TEXT NOT NULL DEFAULT 'GREEN',
    "alert24hSent" BOOLEAN NOT NULL DEFAULT false,
    "alert48hSent" BOOLEAN NOT NULL DEFAULT false,
    "alert72hSent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BurnDownTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMoneyTransaction" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "coreTxnRef" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "txnType" TEXT NOT NULL,
    "txnTimestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'TRN_SUBMISSION',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMoneyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrnSubmission" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "trn" TEXT NOT NULL,
    "declaredAmount" DOUBLE PRECISION NOT NULL,
    "declaredType" TEXT NOT NULL,
    "structuralValid" BOOLEAN NOT NULL DEFAULT false,
    "coreVerified" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrnSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "masterAgentId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalDistributed" DOUBLE PRECISION NOT NULL,
    "lurAvg" DOUBLE PRECISION NOT NULL,
    "baseFee" DOUBLE PRECISION NOT NULL,
    "utilizationBonus" DOUBLE PRECISION NOT NULL,
    "totalCommission" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "commissionId" TEXT NOT NULL,
    "raisedById" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalancerObservation" (
    "id" TEXT NOT NULL,
    "rebalancerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "visitTxnId" TEXT,
    "customerTraffic" INTEGER NOT NULL,
    "competitorFloatVisible" BOOLEAN NOT NULL DEFAULT false,
    "zamtelBrandingVisible" BOOLEAN NOT NULL DEFAULT true,
    "agentAttitude" INTEGER NOT NULL,
    "notes" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RebalancerObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "MasterAgent_userId_key" ON "MasterAgent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Rebalancer_userId_key" ON "Rebalancer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_msisdn_key" ON "Agent"("msisdn");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_qrCodeToken_key" ON "Agent"("qrCodeToken");

-- CreateIndex
CREATE UNIQUE INDEX "RebalanceTransaction_requestId_key" ON "RebalanceTransaction"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "BurnDownTracker_txnId_key" ON "BurnDownTracker"("txnId");

-- CreateIndex
CREATE UNIQUE INDEX "RebalancerObservation_visitTxnId_key" ON "RebalancerObservation"("visitTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- AddForeignKey
ALTER TABLE "MasterAgent" ADD CONSTRAINT "MasterAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rebalancer" ADD CONSTRAINT "Rebalancer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rebalancer" ADD CONSTRAINT "Rebalancer_masterAgentId_fkey" FOREIGN KEY ("masterAgentId") REFERENCES "MasterAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_masterAgentId_fkey" FOREIGN KEY ("masterAgentId") REFERENCES "MasterAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceRequest" ADD CONSTRAINT "RebalanceRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceRequest" ADD CONSTRAINT "RebalanceRequest_rebalancerId_fkey" FOREIGN KEY ("rebalancerId") REFERENCES "Rebalancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceTransaction" ADD CONSTRAINT "RebalanceTransaction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RebalanceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceTransaction" ADD CONSTRAINT "RebalanceTransaction_rebalancerId_fkey" FOREIGN KEY ("rebalancerId") REFERENCES "Rebalancer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalanceTransaction" ADD CONSTRAINT "RebalanceTransaction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurnDownTracker" ADD CONSTRAINT "BurnDownTracker_txnId_fkey" FOREIGN KEY ("txnId") REFERENCES "RebalanceTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurnDownTracker" ADD CONSTRAINT "BurnDownTracker_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMoneyTransaction" ADD CONSTRAINT "AgentMoneyTransaction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrnSubmission" ADD CONSTRAINT "TrnSubmission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_masterAgentId_fkey" FOREIGN KEY ("masterAgentId") REFERENCES "MasterAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalancerObservation" ADD CONSTRAINT "RebalancerObservation_rebalancerId_fkey" FOREIGN KEY ("rebalancerId") REFERENCES "Rebalancer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalancerObservation" ADD CONSTRAINT "RebalancerObservation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalancerObservation" ADD CONSTRAINT "RebalancerObservation_visitTxnId_fkey" FOREIGN KEY ("visitTxnId") REFERENCES "RebalanceTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;


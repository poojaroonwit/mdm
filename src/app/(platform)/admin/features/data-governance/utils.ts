/**
 * Data Governance Feature Utils
 * Utility functions for the data governance feature
 */

import { DataAsset, QualityCheck, DataPolicy, GovernanceMetrics } from './types'

export function getAssetTypeIcon(type: string) {
  switch (type) {
    case 'table':
      return 'Table'
    case 'database':
      return 'Database'
    case 'dashboard':
      return 'LayoutDashboard'
    case 'pipeline':
      return 'Workflow'
    case 'topic':
      return 'MessageSquare'
    case 'mlmodel':
      return 'Brain'
    default:
      return 'FileText'
  }
}

export function getQualityStatusColor(status: string) {
  switch (status) {
    case 'passed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getClassificationColor(category: string) {
  switch (category) {
    case 'public':
      return 'bg-green-100 text-green-800'
    case 'internal':
      return 'bg-blue-100 text-blue-800'
    case 'confidential':
      return 'bg-yellow-100 text-yellow-800'
    case 'restricted':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function calculateGovernanceMetrics(
  assets: DataAsset[],
  policies: DataPolicy[]
): GovernanceMetrics {
  const totalAssets = assets.length
  const assetsWithPolicies = assets.filter(asset =>
    policies.some(policy => policy.appliesTo.includes(asset.fullyQualifiedName))
  ).length
  const assetsWithQualityChecks = assets.filter(asset => asset.quality?.checks.length).length
  
  const qualityScores = assets
    .filter(asset => asset.quality?.score)
    .map(asset => asset.quality!.score)
  const averageQualityScore = qualityScores.length > 0
    ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
    : 0

  const policyComplianceRate = totalAssets > 0
    ? (assetsWithPolicies / totalAssets) * 100
    : 0

  const classifiedAssets = assets.filter(asset => asset.tags.length > 0).length
  const dataClassificationCoverage = totalAssets > 0
    ? (classifiedAssets / totalAssets) * 100
    : 0

  return {
    totalAssets,
    assetsWithPolicies,
    assetsWithQualityChecks,
    averageQualityScore,
    policyComplianceRate,
    dataClassificationCoverage
  }
}

export function formatFQN(fqn: string): string {
  return fqn.split('.').pop() || fqn
}

export function isAssetCompliant(asset: DataAsset, policies: DataPolicy[]): boolean {
  return policies.some(policy =>
    policy.isActive && policy.appliesTo.includes(asset.fullyQualifiedName)
  )
}

export function filterAssetsByType(assets: DataAsset[], type: string): DataAsset[] {
  return assets.filter(asset => asset.type === type)
}

export function filterAssetsByTag(assets: DataAsset[], tag: string): DataAsset[] {
  return assets.filter(asset => asset.tags.includes(tag))
}

export function sortAssetsByName(assets: DataAsset[]): DataAsset[] {
  return [...assets].sort((a, b) => a.name.localeCompare(b.name))
}

export function getQualityCheckStatus(checks: QualityCheck[]): {
  passed: number
  failed: number
  warning: number
} {
  return checks.reduce(
    (acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1
      return acc
    },
    { passed: 0, failed: 0, warning: 0 } as Record<string, number>
  ) as { passed: number; failed: number; warning: number }
}


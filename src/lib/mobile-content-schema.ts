/**
 * Mobile Content Schema - AEM-like Component Schema for Mobile Applications
 *
 * This module defines a standardized schema for UI components that can be
 * consumed by mobile applications (iOS, Android, React Native, Flutter, etc.)
 */

import { ComponentSchema, type Component } from './mobile-content-schema/component'
import { MobileAppSchema, type MobileApp } from './mobile-content-schema/app'
import { PageSchema, type Page } from './mobile-content-schema/page'

export * from './mobile-content-schema/base'
export * from './mobile-content-schema/style'
export * from './mobile-content-schema/data-binding'
export * from './mobile-content-schema/action'
export * from './mobile-content-schema/component'
export * from './mobile-content-schema/page'
export * from './mobile-content-schema/navigation'
export * from './mobile-content-schema/app'
export * from './mobile-content-schema/export-options'

export function validateComponent(data: unknown): Component {
  return ComponentSchema.parse(data)
}

export function validatePage(data: unknown): Page {
  return PageSchema.parse(data)
}

export function validateMobileApp(data: unknown): MobileApp {
  return MobileAppSchema.parse(data)
}

export function safeParseComponent(data: unknown) {
  return ComponentSchema.safeParse(data)
}

export function safeParsePage(data: unknown) {
  return PageSchema.safeParse(data)
}

export function safeParseMobileApp(data: unknown) {
  return MobileAppSchema.safeParse(data)
}

export const MOBILE_SCHEMA_VERSION = '1.0.0'
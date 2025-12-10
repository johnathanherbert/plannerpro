// Example E2E test - smoke test for landing page
import { test, expect } from '@playwright/test'

test.describe('PlannerPro Landing Page', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /Planejamento Financeiro/i })).toBeVisible()
    
    // Check for CTA buttons
    await expect(page.getByRole('link', { name: /Começar Gratuitamente/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Já tenho conta/i })).toBeVisible()
  })

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Criar Conta/i }).first().click()
    
    // Should be on signup page
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.getByRole('heading', { name: /PlannerPro/i })).toBeVisible()
  })

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Entrar/i }).first().click()
    
    // Should be on signin page
    await expect(page).toHaveURL(/\/auth\/signin/)
    await expect(page.getByRole('heading', { name: /PlannerPro/i })).toBeVisible()
  })

  test('should display feature cards', async ({ page }) => {
    await page.goto('/')
    
    // Check for feature cards
    await expect(page.getByText(/Controle Completo/i)).toBeVisible()
    await expect(page.getByText(/Financeiro Familiar/i)).toBeVisible()
    await expect(page.getByText(/Relatórios Visuais/i)).toBeVisible()
    await expect(page.getByText(/Seguro e Privado/i)).toBeVisible()
  })
})

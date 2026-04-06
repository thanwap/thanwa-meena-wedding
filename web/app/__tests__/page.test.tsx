// web/app/__tests__/page.test.tsx
import { render, screen } from '@testing-library/react'
import Page from '../page'

describe('Save the Date page', () => {
  it('renders the couple names', () => {
    render(<Page />)
    expect(screen.getByText('Thanwa')).toBeInTheDocument()
    expect(screen.getByText('Meena')).toBeInTheDocument()
  })

  it('renders the wedding date', () => {
    render(<Page />)
    expect(screen.getByText('26 · 12 · 2026')).toBeInTheDocument()
  })

  it('renders the venue', () => {
    render(<Page />)
    expect(
      screen.getByText('The Cop Seminar and Resort, Pattaya')
    ).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<Page />)
    expect(
      screen.getByText('Join us as we celebrate our love')
    ).toBeInTheDocument()
  })

  it('renders the coming soon badge', () => {
    render(<Page />)
    expect(screen.getByText('WEBSITE COMING SOON')).toBeInTheDocument()
  })

  it('renders the Google Maps link with correct href', () => {
    render(<Page />)
    const link = screen.getByRole('link', { name: /view on google maps/i })
    expect(link).toHaveAttribute(
      'href',
      'https://maps.app.goo.gl/WysXSoYYKXm98CcD8'
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

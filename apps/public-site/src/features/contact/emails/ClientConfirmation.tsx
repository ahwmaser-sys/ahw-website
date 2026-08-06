import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
} from '@react-email/components';

interface ClientConfirmationProps {
  name: string;
  officeName: string;
  siteUrl: string;
}

export function ClientConfirmationEmail({ name, officeName, siteUrl }: ClientConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for contacting AHW Architects</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>AHW Architects</Heading>
          
          <Section>
            <Text style={greeting}>Dear {name},</Text>
            <Text style={text}>
              Thank you for reaching out to AHW Architects. This email confirms that we have successfully received your inquiry.
            </Text>
            <Text style={text}>
              Your message has been securely routed to our <strong>{officeName}</strong>. Our team is currently reviewing your project details and will be in touch with you shortly to discuss how we can bring your vision to life.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footerText}>
              AHW Architects is a multidisciplinary architecture, interior design, engineering, and construction company delivering integrated design-build solutions from concept to completion.
            </Text>
            <Text style={footerLink}>
              <a href={siteUrl} style={link}>Visit our website</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px',
  marginBottom: '64px',
  border: '1px solid #eee',
  borderRadius: '5px',
};

const h1 = {
  color: '#0f1115',
  fontSize: '20px',
  fontWeight: '300',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  margin: '0 0 30px',
};

const greeting = {
  color: '#0f1115',
  fontSize: '18px',
  fontWeight: '300',
  margin: '0 0 16px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  fontWeight: '300',
  margin: '0 0 16px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '30px 0',
};

const footerText = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
};

const footerLink = {
  textAlign: 'center' as const,
  margin: '16px 0 0',
};

const link = {
  color: '#0f1115',
  textDecoration: 'underline',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

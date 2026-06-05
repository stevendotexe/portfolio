import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  WhatsAppIcon,
} from "@/components/icons";

type ContactLink = {
  href: string;
  external?: boolean;
  label: string;
  value: string;
  icon: ReactNode;
};

const contactLinks: ContactLink[] = [
  {
    href: "mailto:stevensimb2@gmail.com",
    label: "Email",
    value: "stevensimb2@gmail.com",
    icon: <MailIcon />,
  },
  {
    href: "https://wa.me/6281574808829",
    external: true,
    label: "WhatsApp",
    value: "+62 815 7480 8829",
    icon: <WhatsAppIcon />,
  },
  {
    href: "https://instagram.com/steyvehnn",
    external: true,
    label: "Instagram",
    value: "@steyvehnn",
    icon: <InstagramIcon />,
  },
  {
    href: "https://www.linkedin.com/in/steven-simbolon/",
    external: true,
    label: "LinkedIn",
    value: "steven-simbolon",
    icon: <LinkedInIcon />,
  },
  {
    href: "https://github.com/stevendotexe",
    external: true,
    label: "GitHub",
    value: "stevendotexe",
    icon: <GitHubIcon width={24} height={24} />,
  },
];

export function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <h2 className="section-title">Get In Touch</h2>
        <p className="section-subtitle">
          Feel free to reach out for collaborations or just a friendly hello!
        </p>

        <div className="contact-links">
          {contactLinks.map((link) => (
            <Reveal key={link.label}>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="contact-card"
              >
                <div className="contact-icon">{link.icon}</div>
                <span className="contact-label">{link.label}</span>
                <span className="contact-value">{link.value}</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

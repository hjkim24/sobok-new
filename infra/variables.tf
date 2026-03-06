variable "tenancy_ocid" {
  description = "OCI tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI user OCID"
  type        = string
}

variable "fingerprint" {
  description = "API key fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to the OCI API private key file"
  type        = string
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "ap-chuncheon-1"
}

variable "compartment_ocid" {
  description = "Compartment OCID (defaults to tenancy root)"
  type        = string
  default     = ""
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
}

variable "ssh_private_key_path" {
  description = "Path to the SSH private key (for provisioners)"
  type        = string
  default     = "~/.ssh/id_ed25519"
}

variable "domain" {
  description = "Custom domain for the application (e.g. api.sobok.com)"
  type        = string
}

variable "certbot_email" {
  description = "Email for Let's Encrypt certificate notifications"
  type        = string
}

variable "instance_ocpus" {
  description = "Number of OCPUs for the ARM instance"
  type        = number
  default     = 2
}

variable "instance_memory_gb" {
  description = "Memory in GB for the ARM instance"
  type        = number
  default     = 12
}

variable "boot_volume_gb" {
  description = "Boot volume size in GB"
  type        = number
  default     = 50
}

# --- AWS (Route 53 DNS) ---
variable "aws_access_key" {
  description = "AWS access key for Route 53"
  type        = string
}

variable "aws_secret_key" {
  description = "AWS secret key for Route 53"
  type        = string
  sensitive   = true
}

variable "aws_route53_zone_id" {
  description = "Route 53 Hosted Zone ID for the domain"
  type        = string
}

variable "betterstack_token" {
  description = "BetterStack source token for log ingestion"
  type        = string
  sensitive   = true
}

locals {
  compartment_ocid = var.compartment_ocid != "" ? var.compartment_ocid : var.tenancy_ocid
}

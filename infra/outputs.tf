output "public_ip" {
  description = "Reserved public IP address"
  value       = oci_core_public_ip.sobok.ip_address
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh opc@${oci_core_public_ip.sobok.ip_address}"
}

output "app_url" {
  description = "Application URL"
  value       = "https://${var.domain}"
}

output "instance_id" {
  description = "Compute instance OCID"
  value       = oci_core_instance.sobok.id
}

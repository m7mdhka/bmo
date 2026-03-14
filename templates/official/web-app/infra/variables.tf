variable "aws_region" {
  description = "AWS region used for this stack."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used in resource naming."
  type        = string
  default     = "bmo-web-app"
}

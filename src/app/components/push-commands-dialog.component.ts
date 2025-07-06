import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PushDialogData {
  registryHost: string;
  selectedRepo?: string;
}

@Component({
  selector: 'app-push-commands-dialog',
  templateUrl: './push-commands-dialog.component.html',
  styleUrls: ['./push-commands-dialog.component.scss']
})
export class PushCommandsDialogComponent {
  copyMessage = '';

  constructor(
    public dialogRef: MatDialogRef<PushCommandsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PushDialogData
  ) {}

  get dockerDaemonConfig(): string {
    return `{
  "insecure-registries": ["${this.data.registryHost}"]
}`;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.copyMessage = 'Copied to clipboard!';
    setTimeout(() => {
      this.copyMessage = '';
    }, 2000);
  }

  copyDaemonConfig() {
    this.copyToClipboard(this.dockerDaemonConfig);
  }

  openDockerDocs() {
    window.open('https://docs.docker.com/engine/reference/commandline/push/', '_blank');
  }
}

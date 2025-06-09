import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Agent, CreateChatRequest } from '../../models';

interface DialogData {
  agents: Agent[];
}

@Component({
  selector: 'app-create-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './create-chat-dialog.component.html',
  styleUrls: ['./create-chat-dialog.component.css']
})
export class CreateChatDialogComponent {
  chatName = '';
  selectedAgentId = '';

  constructor(
    public dialogRef: MatDialogRef<CreateChatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Set default agent if available
    if (this.data.agents.length > 0) {
      this.selectedAgentId = this.data.agents[0].id;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (!this.selectedAgentId) {
      return;
    }

    const request: CreateChatRequest = {
      agentId: this.selectedAgentId,
      name: this.chatName.trim() || undefined
    };

    this.dialogRef.close(request);
  }

  isValid(): boolean {
    return !!this.selectedAgentId;
  }
}
